// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { CommandLineFlagParameter, CommandLineStringListParameter } from '@rushstack/ts-command-line';

import { BaseRushAction } from './BaseRushAction';
import { RushConfigurationProject } from '../../api/RushConfigurationProject';
import type * as PackageJsonUpdaterType from '../../logic/PackageJsonUpdater';

export interface IBasePackageJsonUpdaterRushOptions {
  /**
   * The projects whose package.jsons should get updated
   */
  projects: RushConfigurationProject[];
  /**
   * The dependencies to be added.
   */
  packagesToHandle: PackageJsonUpdaterType.IPackageForRushUpdate[];
  /**
   * If specified, "rush update" will not be run after updating the package.json file(s).
   */
  skipUpdate: boolean;
  /**
   * If specified, "rush update" will be run in debug mode.
   */
  debugInstall: boolean;
}

/**
 * This is the common base class for AddAction and RemoveAction.
 */
export abstract class BaseAddAndRemoveAction extends BaseRushAction {
  protected _allFlag!: CommandLineFlagParameter;
  protected _skipUpdateFlag!: CommandLineFlagParameter;
  protected _packageNameList!: CommandLineStringListParameter;

  protected get specifiedPackageNameList(): readonly string[] {
    return this._packageNameList.values!;
  }

  protected abstract getUpdateOptions(): PackageJsonUpdaterType.IPackageJsonUpdaterRushBaseUpdateOptions;

  protected onDefineParameters(): void {
    this._skipUpdateFlag = this.defineFlagParameter({
      parameterLongName: '--skip-update',
      parameterShortName: '-s',
      description:
        'If specified, the "rush update" command will not be run after updating the package.json files.'
    });
  }

  protected getProjects(): RushConfigurationProject[] {
    if (this._allFlag.value) {
      return this.rushConfiguration.projects;
    } else {
      const currentProject: RushConfigurationProject | undefined =
        this.rushConfiguration.tryGetProjectForPath(process.cwd());

      if (!currentProject) {
        throw new Error(
          `The rush "${this.actionName}" command must be invoked under a project` +
            ` folder that is registered in rush.json unless the ${this._allFlag.longName} is used.`
        );
      }

      return [currentProject];
    }
  }

  public async runAsync(): Promise<void> {
    const packageJsonUpdater: typeof PackageJsonUpdaterType = await import('../../logic/PackageJsonUpdater');
    const updater: PackageJsonUpdaterType.PackageJsonUpdater = new packageJsonUpdater.PackageJsonUpdater(
      this.rushConfiguration,
      this.rushGlobalFolder
    );

    await updater.doRushUpdateAsync(this.getUpdateOptions());
  }
}
