import * as Process from 'node:process'
import * as Parsing from '@typescriptprime/parsing'
import * as Zod from 'zod'
import * as Semver from 'semver'
import PackageJson from '@npmcli/package-json'
import * as Fs from 'node:fs'

type TParameters = {
  Ref: string,
  PackageJsonDirPath: string
  WorkspacePath: string
}

let Parameters = (await Parsing.PostProcessing<TParameters>(Parsing.PreProcessing(Process.argv))).Options

await Zod.strictObject({
  Tag: Zod.stringFormat(Parameters.Ref, Value => Value.startsWith('refs/tags/') && Semver.valid(Value.replaceAll(/^refs\/tags\//g, '')) !== null),
  WorkspacePath: Zod.stringFormat(Parameters.WorkspacePath, Value => Fs.existsSync(Value) && Fs.lstatSync(Value).isDirectory()),
  PackageJsonDirPath: Zod.stringFormat(Parameters.PackageJsonDirPath,
    async Value => Fs.existsSync(`${Parameters.WorkspacePath}${Value === '' ? '/package.json' : `/${Value}/package.json`}`)
    && await PackageJson.load(`${Parameters.WorkspacePath}${Value === '' ? '' : `/${Value}`}`)),
}).parseAsync(Parameters)

let PackageJsonData = await PackageJson.load(`${Parameters.WorkspacePath}${Parameters.PackageJsonDirPath === '' ? '' : `/${Parameters.PackageJsonDirPath}`}`)
PackageJsonData.update({
  version: Semver.clean(Parameters.Ref.replaceAll(/^refs\/tags\//g, ''))
})
await PackageJsonData.save()