import { TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RgwMultisiteService } from '~/app/shared/api/rgw-multisite.service';
import { CellTemplate } from '~/app/shared/enum/cell-template.enum';
import { CdTableColumn } from '~/app/shared/models/cd-table-column';

@Component({
  selector: 'cd-rgw-multisite-sync-policy',
  templateUrl: './rgw-multisite-sync-policy.component.html',
  styleUrls: ['./rgw-multisite-sync-policy.component.scss']
})
export class RgwMultisiteSyncPolicyComponent implements OnInit {
  columns: Array<CdTableColumn> = [];
  syncPolicyData: any = [];

  constructor(
    private rgwMultisiteService: RgwMultisiteService,
    private titleCasePipe: TitleCasePipe
  ) {}

  ngOnInit(): void {
    this.columns = [
      {
        prop: 'uniqueId',
        isInvisible: true,
        isHidden: true
      },
      {
        name: $localize`Group Name`,
        prop: 'groupName',
        flexGrow: 1
      },
      {
        name: $localize`Status`,
        prop: 'status',
        flexGrow: 1,
        cellTransformation: CellTemplate.tooltip,
        customTemplateConfig: {
          map: {
            Enabled: { class: 'badge-success', tooltip: 'sync is allowed and enabled' },
            Allowed: { class: 'badge-info', tooltip: 'sync is allowed' },
            Forbidden: {
              class: 'badge-warning',
              tooltip:
                'sync (as defined by this group) is not allowed and can override other groups'
            }
          }
        },
        pipe: this.titleCasePipe
      },
      {
        name: $localize`Zonegroup`,
        prop: 'zonegroup',
        flexGrow: 1,
        cellTransformation: CellTemplate.map,
        customTemplateConfig: {
          undefined: '-',
          '': '-'
        }
      },
      {
        name: $localize`Bucket`,
        prop: 'bucket',
        flexGrow: 1,
        cellTransformation: CellTemplate.map,
        customTemplateConfig: {
          undefined: '-',
          '': '-'
        }
      }
    ];

  transformSyncPolicyData(allSyncPolicyData: any) {
    if (allSyncPolicyData && allSyncPolicyData.length > 0) {
      allSyncPolicyData.forEach((policy: any) => {
        this.syncPolicyData.push({
          uniqueId: policy['id'] + (policy['bucketName'] ? policy['bucketName'] : ''),
          groupName: policy['id'],
          status: policy['status'],
          bucket: policy['bucketName'],
          zonegroup: policy['zonegroup']
        });
      });
      this.syncPolicyData = [...this.syncPolicyData];
    }
  }

  updateSelection(selection: CdTableSelection) {
    this.selection = selection;
  }

  getPolicyList(context?: CdTableFetchDataContext) {
    this.rgwMultisiteService.getSyncPolicy('', '', true).subscribe(
      (resp: object[]) => {
        this.syncPolicyData = [];
        this.transformSyncPolicyData(resp);
      },
      () => {
        if (context) {
          context.error();
        }
      }
    );
  }

  deleteAction() {
    const groupNames = this.selection.selected.map((policy: any) => policy.groupName);
    this.modalService.show(CriticalConfirmationModalComponent, {
      itemDescription: this.selection.hasSingleSelection
        ? $localize`Policy Group`
        : $localize`Policy Groups`,
      itemNames: groupNames,
      bodyTemplate: this.deleteTpl,
      submitActionObservable: () => {
        return new Observable((observer: Subscriber<any>) => {
          this.taskWrapper
            .wrapTaskAroundCall({
              task: new FinishedTask('rgw/multisite/sync-policy/delete', {
                group_names: groupNames
              }),
              call: observableForkJoin(
                this.selection.selected.map((policy: any) => {
                  return this.rgwMultisiteService.removeSyncPolicyGroup(
                    policy.groupName,
                    policy.bucket
                  );
                })
              )
            })
            .subscribe({
              error: (error: any) => {
                // Forward the error to the observer.
                observer.error(error);
                // Reload the data table content because some deletions might
                // have been executed successfully in the meanwhile.
                this.table.refreshBtn();
              },
              complete: () => {
                // Notify the observer that we are done.
                observer.complete();
                // Reload the data table content.
                this.table.refreshBtn();
              }
            });
          });
          this.syncPolicyData = [...this.syncPolicyData];
        }
      });
  }
}
