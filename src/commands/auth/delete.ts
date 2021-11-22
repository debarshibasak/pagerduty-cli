import Command from '../../authbase'
import AuthGet from './get'
import {flags} from '@oclif/command'
import chalk from 'chalk'
import cli from 'cli-ux'

export default class AuthDelete extends Command {
  static description = 'Delete a PagerDuty domain authentication'

  static flags = {
    ...Command.flags,
    alias: flags.string({
      char: 'a',
      description: 'The alias of the PD domain authentication to delete',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(AuthDelete)
    if (!this._config.has(flags.alias)) {
      this.error(`Alias ${chalk.bold.blue(flags.alias)} doesn't exist`, {exit: 1})
    }
    const deletingDefault = this._config.defaultAlias() === flags.alias ? true : false
    cli.action.start(`Deleting auth for ${flags.alias}`)
    if (this._config.delete(flags.alias)) {
      this._config.save()
      this.init()
      cli.action.stop(chalk.bold.green('done'))
      if (this._config.all().length === 0) {
        this.log('That was your only configured domain, so you\'re not logged in to PagerDuty any more')
      } else if (deletingDefault) {
        this.log('That was your default domain, so you\'re not logged in to it any more')
        const me = await this.me()
        const domain = await this.pd.domain()
        if (me && me.user.id) {
          cli.action.stop(chalk.bold.green('done'))
          this.log(`You are logged in to ${chalk.bold.blue(domain)} as ${chalk.bold.blue(me.user.email)} (alias: ${chalk.bold.blue(this._config.defaultAlias())})`)
        } else {
          cli.action.stop(chalk.bold.green('done'))
          this.log(`You are logged in to ${chalk.bold.blue(domain)} using a legacy API token (alias: ${chalk.bold.blue(this._config.defaultAlias())})`)
        }
      }
    } else {
      cli.action.stop(chalk.bold.red('failed!'))
      this.error(`Failed to delete ${flags.alias}. Are you sure it exists?`, {
        suggestions: ['pd auth:list'],
        exit: 1,
      })
    }
  }
}