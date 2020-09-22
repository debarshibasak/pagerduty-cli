import Command from '../../base'
import {flags} from '@oclif/command'
import chalk from 'chalk'
import cli from 'cli-ux'
import * as pd from '../../pd'

export default class IncidentNotes extends Command {
  static description = 'See or add notes on PagerDuty Incidents'

  static flags = {
    ...Command.flags,
    id: flags.string({
      char: 'i',
      description: 'Incident ID.',
      required: true,
    }),
    note: flags.string({
      char: 'n',
      description: 'Note to add',
    }),
  }

  async run() {
    const {flags} = this.parse(IncidentNotes)

    // get a validated token from base class
    const token = this.token as string

    if (flags.note) {
      // add a note
      cli.action.start(`Adding a note to incident ${chalk.bold.blue(flags.id)}`)
      const body = {
        note: {
          content: flags.note,
        },
      }
      try {
        const note = await pd.request(token, `/incidents/${flags.id}/notes`, 'POST', null, body)
        if (note && note.note && note.note.id) {
          cli.action.stop(chalk.bold.green('done'))
        } else {
          cli.action.stop(chalk.bold.red('failed!'))
        }
      } catch (error) {
        this.error(`Failed to add a note to incident ${flags.id}: ${error}`, {exit: 1})
      }
    } else {
      // get notes
      cli.action.start(`Getting notes for incident ${chalk.bold.blue(flags.id)}`)
      const notes = await pd.fetch(token, `/incidents/${flags.id}/notes`)
      if (notes.length === 0) {
        cli.action.stop(chalk.bold.red('none found'))
        return
      }
      cli.action.stop(`got ${notes.length}`)
      const columns: Record<string, object> = {
        id: {
          header: 'ID',
        },
        created: {
          get: (row: { created_at: string }) => (new Date(row.created_at)).toLocaleString(),
        },
        added_by: {
          get: (row: { user: { summary: any } }) => row.user.summary,
        },
        content: {
        },
      }
      const options = {
        printLine: this.log,
        ...flags, // parsed flags
      }
      cli.table(notes, columns, options)
    }
  }
}