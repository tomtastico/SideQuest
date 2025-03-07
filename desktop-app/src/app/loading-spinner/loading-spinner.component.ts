import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingSpinnerService } from '../loading-spinner.service';

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    styleUrls: ['./loading-spinner.component.css'],
})
export class LoadingSpinnerComponent implements OnInit {
    isActive: boolean;
    isConfirm: boolean;
    isLoading: boolean;
    loadingMessage: string;
    confirmResolve: () => void;
    constructor(private spinnerService: LoadingSpinnerService, public changes: ChangeDetectorRef) {
        spinnerService.setSpinner(this);
    }
    ngOnInit() {}
    confirm() {
        if (this.confirmResolve) {
            this.confirmResolve();
            this.isConfirm = false;
        }
    }
    cancel() {
        this.confirmResolve = null;
        this.isConfirm = false;
        this.spinnerService.hideLoader();
    }
}
