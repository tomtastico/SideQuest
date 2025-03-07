import { Injectable } from '@angular/core';
import { LoadingSpinnerService } from './loading-spinner.service';
import { WebviewService } from './webview.service';
import { FilesComponent } from './files/files.component';
declare let __dirname, process;
export enum FolderType {
    MAIN,
    ADB,
    BSABER,
    BSABER_BACKUPS,
    APK_BACKUPS,
    DATA_BACKUPS,
    QUEST_SABER_PATCH,
    APP_BACKUP,
    SONG_FOLDER,
}

@Injectable({
    providedIn: 'root',
})
export class AppService {
    showSearch: boolean;
    showBrowserBar: boolean;
    showCustomActions: boolean;
    showTaskActions: boolean;
    updateAvailable: boolean;
    showRepo: boolean;
    isFilesOpen: boolean;
    hideNSFW: boolean;
    filesComponent: FilesComponent;

    appData: string;
    fs: any;
    path: any;
    nativeApp: any;
    remote: any;
    electron: any;
    os: any;
    request: any;
    extract: any;
    progress: any;
    Readable: any;
    opn: any;
    spawn: any;
    md5: any;
    semver: any;
    exec: any;
    execSync: any;
    uuidv4: any;
    ping: any;
    titleEle: HTMLElement;
    webService: WebviewService;
    currentTheme: string = 'dark';
    versionName: string = '0.6.6';
    showBack: boolean = false;
    constructor(private spinnerService: LoadingSpinnerService) {
        this.path = (<any>window).require('path');
        this.fs = (<any>window).require('fs');
        this.request = (<any>window).require('request');
        this.extract = (<any>window).require('extract-zip');
        this.progress = (<any>window).require('request-progress');
        this.os = (<any>window).require('os');
        this.Readable = (<any>window).require('stream').Readable;
        this.opn = (<any>window).require('opn');
        this.md5 = (<any>window).require('md5');
        this.spawn = (<any>window).require('child_process').spawn;
        this.semver = (<any>window).require('semver');
        this.electron = (<any>window).require('electron');
        this.remote = this.electron.remote;
        this.nativeApp = this.electron.remote.app;
        this.appData = this.path.join(this.nativeApp.getPath('appData'), 'SideQuest');
        this.exec = (<any>window).require('child_process').exec;
        this.execSync = (<any>window).require('child_process').execSync;
        this.uuidv4 = (<any>window).require('uuid/v4');
        this.ping = (<any>window).require('ping');
        this.makeFolders().then(() => this.spinnerService.hideLoader());
        let theme = localStorage.getItem('theme');
        if (theme && theme === 'light') {
            this.currentTheme = 'light';
        }
        this.hideNSFW = !!localStorage.getItem('hideNSFW');
    }

    getBase64Image(imagePath: string) {
        try {
            return (
                'data:image/' + (<any>imagePath).split('.').pop() + ';base64,' + this.fs.readFileSync(imagePath).toString('base64')
            );
        } catch (e) {
            return null;
        }
    }
    resetTop() {
        this.showSearch = false;
        this.showBrowserBar = false;
        this.showCustomActions = false;
        this.showTaskActions = false;
        this.showRepo = false;
        this.isFilesOpen = false;
    }
    doesFileExist(path) {
        try {
            return this.fs.existsSync(path);
        } catch (err) {
            return false;
        }
    }
    setWebviewService(webService: WebviewService) {
        this.webService = webService;
    }
    setTitleEle(ele: HTMLElement) {
        this.titleEle = ele;
    }
    setTitle(title: string) {
        if (this.titleEle) {
            this.titleEle.innerText = title;
        }
    }
    isTheme(theme: string) {
        return this.currentTheme === theme;
    }
    setTheme(theme: string) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
    }
    getThemeCssClass(prefix: string, isButton?: boolean) {
        let classes = {};
        classes[prefix + '-dark-theme'] = this.isTheme('dark');
        classes[prefix + '-light-theme'] = this.isTheme('light');
        if (isButton || prefix === 'button') {
            classes['waves-dark'] = true;
            classes['waves-light'] = false;
        }
        return classes;
    }
    openFolder(folder: FolderType, packageName?: string) {
        switch (folder) {
            case FolderType.MAIN:
                this.electron.shell.openItem(this.appData);
                break;
            case FolderType.BSABER:
                this.electron.shell.openItem(this.path.join(this.appData, 'bsaber'));
                break;
            case FolderType.BSABER_BACKUPS:
                this.electron.shell.openItem(this.path.join(this.appData, 'bsaber-backups'));
                break;
            case FolderType.ADB:
                this.electron.shell.openItem(this.path.join(this.appData, 'platform-tools'));
                break;
            case FolderType.APK_BACKUPS:
                this.electron.shell.openItem(this.path.join(this.appData, 'backups'));
                break;
            case FolderType.DATA_BACKUPS:
                this.electron.shell.openItem(this.path.join(this.appData, 'bsaber-data-backups'));
                break;
            case FolderType.QUEST_SABER_PATCH:
                this.electron.shell.openItem(this.path.join(this.appData, 'saber-quest-patch', 'questsaberpatch'));
                break;
            case FolderType.APP_BACKUP:
                this.electron.shell.openItem(this.path.join(this.appData, 'backups', packageName));
                break;
            case FolderType.SONG_FOLDER:
                this.electron.shell.openItem(this.path.join(this.appData, 'bsaber', packageName));
                break;
        }
    }
    seedSources() {
        if (!this.fs.existsSync(this.path.join(this.appData, 'sources.txt'))) {
            let sourcesPath = this.path.join(__dirname, 'assets', 'sources.txt');
            if (!this.fs.existsSync(sourcesPath)) {
                sourcesPath = this.path.join(process.cwd(), 'desktop-app', 'src', 'assets', 'sources.txt');
            }
            this.fs.createReadStream(sourcesPath).pipe(this.fs.createWriteStream(this.path.join(this.appData, 'sources.txt')));
        }
    }
    makeFolders() {
        return this.mkdir(this.appData)
            .then(() => this.mkdir(this.path.join(this.appData, 'backups')))
            .then(() => this.mkdir(this.path.join(this.appData, 'bsaber-backups')))
            .then(() => this.mkdir(this.path.join(this.appData, 'tmp')))
            .then(() => this.mkdir(this.path.join(this.appData, 'bsaber-data-backups')))
            .then(() => this.mkdir(this.path.join(this.appData, 'bsaber')))
            .then(() => this.mkdir(this.path.join(this.appData, 'saber-quest-patch')))
            .then(() => {});
    }
    async mkdir(path) {
        return new Promise(resolve => {
            this.fs.mkdir(path, { recursive: true }, resolve);
        });
    }
    setExecutable(path) {
        return new Promise(resolve => {
            const ls = this.spawn('chmod', ['+x', path]);
            ls.on('close', code => {
                resolve();
            });
        });
    }
    async downloadFile(winUrl, linUrl, macUrl, getPath, task?) {
        const requestOptions = {
            timeout: 30000,
            'User-Agent': this.getUserAgent(),
        };
        let downloadUrl = linUrl;
        switch (this.os.platform()) {
            case 'win32':
                downloadUrl = winUrl;
                break;
            case 'darwin':
                downloadUrl = macUrl;
                break;
            case 'linux':
                downloadUrl = linUrl;
                break;
        }
        if (!downloadUrl) return;
        let downloadPath = getPath(downloadUrl);
        return new Promise((resolve, reject) => {
            this.progress(this.request(downloadUrl, requestOptions), { throttle: 300 })
                .on('error', error => {
                    console.log(`Request Error ${error}`);
                    reject(error);
                })
                .on('progress', state => {
                    if (task) {
                        task.status = 'Downloading... ' + Math.round(state.percent * 100) + '%';
                    } else {
                        this.spinnerService.setMessage('Downloading... ' + Math.round(state.percent * 100) + '%');
                        this.spinnerService.spinner.changes.detectChanges();
                    }
                })
                .on('end', () => {
                    if (task) {
                        task.status = 'Processing... This might take 10 - 30 seconds.';
                    } else {
                        this.spinnerService.setMessage('Processing... <br>This might take 10 - 30 seconds.');
                    }
                    return resolve(downloadPath);
                })
                .pipe(this.fs.createWriteStream(downloadPath));
        });
    }
    getUserAgent() {
        const nodeString = `NodeJs/${(<any>window).process.version}`;
        const packageString = 'OpenStoreVR';
        const computerString = `Hostname/${this.os.hostname()} Platform/${this.os.platform()} PlatformVersion/${this.os.release()}`;
        return `${packageString} ${nodeString} ${computerString}`;
    }
    deleteFolderRecursive(path) {
        if (this.fs.existsSync(path)) {
            this.fs.readdirSync(path).forEach(file => {
                let curPath = path + '/' + file;
                if (this.fs.lstatSync(curPath).isDirectory()) {
                    // recurse
                    this.deleteFolderRecursive(curPath);
                } else {
                    // delete file
                    this.fs.unlinkSync(curPath);
                }
            });
            this.fs.rmdirSync(path);
        }
    }
}
