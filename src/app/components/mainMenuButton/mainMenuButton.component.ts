import { Component, OnInit } from '@angular/core';
import { CollectionService } from '../../services/collection.service';
import { AddCollectionDialogComponent } from '../dialogs/addCollectionDialog/addCollectionDialog.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { Collection } from '../../data/collection';
import log from 'electron-log';
import { RenameCollectionDialogComponent } from '../dialogs/renameCollectionDialog/renameCollectionDialog.component';
import { SnackBarService } from '../../services/snackBar.service';
import { ConfirmationDialogComponent } from '../dialogs/confirmationDialog/confirmationDialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'main-menu-button',
  templateUrl: './mainMenuButton.component.html',
  styleUrls: ['./mainMenuButton.component.scss']
})
export class MainMenuButtonComponent implements OnInit {
  private subscription: Subscription;

  constructor(private dialog: MatDialog, private collectionService: CollectionService,
    private snackBarService: SnackBarService, private translateService: TranslateService) {
    this.subscription = collectionService.storageDirectoryChanged$.subscribe((hasStorageDirectory) => this.hasStorageDirectory = hasStorageDirectory);
    this.subscription.add(collectionService.collectionsChanged$.subscribe(() => this.collections = this.collectionService.getCollections()));

    this.subscription.add(collectionService.collectionActivated$.subscribe(async (collectionName) => {
      this.collections = await this.collectionService.getCollections();
      this.snackBarService.collectionActivated(collectionName);
    }));

    this.subscription.add(collectionService.collectionAdded$.subscribe(async (collectionName) => {
      this.collections = await this.collectionService.getCollections();
      this.snackBarService.collectionAdded(collectionName);
    }));

    this.subscription.add(collectionService.collectionRenamed$.subscribe(async (newCollectionName) => {
      this.collections = await this.collectionService.getCollections();
      this.snackBarService.collectionRenamed(newCollectionName);
    }));

    this.subscription.add(collectionService.collectionDeleted$.subscribe(async (collectionName) => {
      this.collections = this.collectionService.getCollections();
      this.snackBarService.collectionDeleted(collectionName);
    }));

    this.hasStorageDirectory = this.collectionService.hasStorageDirectory();
  }

  public hasStorageDirectory: boolean;
  public collections: Collection[];

  ngOnInit() {
    this.collections = this.collectionService.getCollections();
  }

  public addCollection(): void {
    log.info("Pressed addCollection()");

    let dialogRef: MatDialogRef<AddCollectionDialogComponent> = this.dialog.open(AddCollectionDialogComponent, {
      width: '450px'
    });
  }

  public async activateCollection(collectionId: string) {
    log.info(`Pressed activateCollection(${collectionId})`);
    this.collectionService.activateCollection(collectionId);
  }

  public renameCollection(collectionId: string) {
    log.info(`Pressed renameCollection(${collectionId})`);

    let dialogRef: MatDialogRef<RenameCollectionDialogComponent> = this.dialog.open(RenameCollectionDialogComponent, {
      width: '450px', data: { collectionId: collectionId }
    });
  }

  public deleteCollection(collectionId: string) {
    log.info(`Pressed deleteCollection(${collectionId})`);

    let collectionName: string = this.collectionService.getCollectionName(collectionId);
    let title: string = this.translateService.instant('DialogTitles.ConfirmDeleteCollection');
    let text: string = this.translateService.instant('DialogTexts.ConfirmDeleteCollection').replace("{collectionName}", `"${collectionName}"`);

    let dialogRef: MatDialogRef<ConfirmationDialogComponent> = this.dialog.open(ConfirmationDialogComponent, {
      
      width: '450px', data: { dialogTitle: title, dialogText: text }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.collectionService.deleteCollectionAsync(collectionId);
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
