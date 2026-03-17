import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss']
})
export class UserCreateComponent {
  public firstName = '';
  public lastName = '';
  public jmbg = '';
  public submitting = false;

  constructor(private router: Router, private route: ActivatedRoute) {}

  public submit(form: NgForm): void {
    this.submitting = true;

    // If form is invalid, do not proceed and show validation messages
    if (form.invalid) {
      form.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

  // Simulate creation and generate an id. In real app, call UserService.create(...) and use returned id.
  const createdId = 'c' + String(Math.floor(Math.random() * 1000000));
  const createdName = `${this.firstName} ${this.lastName}`.trim();

  // Read returnUrl from query params (if provided)
  const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/employees/accounts/new';

  // Navigate back to returnUrl with navigation state containing createdClientId and name
  this.router.navigateByUrl(returnUrl, { state: { createdClientId: createdId, createdClientName: createdName } });
  }
}
