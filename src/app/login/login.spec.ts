import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Login } from './login';
import { Auth } from '../auth/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: {
    signIn: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signInWithGoogle: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { signIn: vi.fn(), signUp: vi.fn(), signInWithGoogle: vi.fn() };
    router = { navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects mismatched passwords without calling Supabase', async () => {
    component.mode.set('signup');
    component.email.set('someone@example.com');
    component.password.set('correct-horse');
    component.confirmPassword.set('correct-hoarse');

    await component.submit();

    expect(auth.signUp).not.toHaveBeenCalled();
    expect(component.phase()).toBe('error');
    expect(component.errorText()).toContain('do not match');
  });

  it('shows the message Supabase returns when sign-in fails', async () => {
    auth.signIn.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } });
    component.email.set('someone@example.com');
    component.password.set('wrong');

    await component.submit();

    expect(component.phase()).toBe('error');
    expect(component.errorText()).toBe('Invalid login credentials');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('lands on the overview once signed in', async () => {
    auth.signIn.mockResolvedValue({ data: { session: {} }, error: null });
    component.email.set('someone@example.com');
    component.password.set('right');

    await component.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('waits on the emailed link when sign-up returns no session', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    component.mode.set('signup');
    component.email.set('someone@example.com');
    component.password.set('correct-horse');
    component.confirmPassword.set('correct-horse');

    await component.submit();

    expect(component.phase()).toBe('confirm');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
