import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import logoSvg from "@/assets/logo.svg";

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };
  
  // If user is already authenticated, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Form Column */}
        <div className="col-md-5 bg-light d-flex align-items-center justify-content-center">
          <div className="card border-0 bg-transparent w-100" style={{ maxWidth: '400px' }}>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <img src={logoSvg} alt="AspiraSys Workshop System Logo" className="img-fluid mb-3" style={{ height: '60px' }} />
                <h2 className="fw-bold text-primary mb-1">AspiraSys Workshop System</h2>
                <p className="text-muted">Admin Portal</p>
              </div>
              
              <div className="mb-4">
                <div className="d-flex">
                  <button 
                    className={`btn ${isLogin ? 'btn-primary' : 'btn-outline-secondary'} flex-grow-1 me-2`}
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </button>
                  <button 
                    className={`btn ${!isLogin ? 'btn-primary' : 'btn-outline-secondary'} flex-grow-1`}
                    onClick={() => setIsLogin(false)}
                  >
                    Register
                  </button>
                </div>
              </div>
              
              {isLogin ? (
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input 
                      type="text" 
                      className={`form-control ${loginForm.formState.errors.username ? 'is-invalid' : ''}`}
                      id="username"
                      {...loginForm.register('username')}
                    />
                    {loginForm.formState.errors.username && (
                      <div className="invalid-feedback">
                        {loginForm.formState.errors.username.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input 
                      type="password" 
                      className={`form-control ${loginForm.formState.errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <div className="invalid-feedback">
                        {loginForm.formState.errors.password.message}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : 'Login'}
                  </button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="registerName" className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className={`form-control ${registerForm.formState.errors.name ? 'is-invalid' : ''}`}
                      id="registerName"
                      {...registerForm.register('name')}
                    />
                    {registerForm.formState.errors.name && (
                      <div className="invalid-feedback">
                        {registerForm.formState.errors.name.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="registerEmail" className="form-label">Email</label>
                    <input 
                      type="email" 
                      className={`form-control ${registerForm.formState.errors.email ? 'is-invalid' : ''}`}
                      id="registerEmail"
                      {...registerForm.register('email')}
                    />
                    {registerForm.formState.errors.email && (
                      <div className="invalid-feedback">
                        {registerForm.formState.errors.email.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="registerUsername" className="form-label">Username</label>
                    <input 
                      type="text" 
                      className={`form-control ${registerForm.formState.errors.username ? 'is-invalid' : ''}`}
                      id="registerUsername"
                      {...registerForm.register('username')}
                    />
                    {registerForm.formState.errors.username && (
                      <div className="invalid-feedback">
                        {registerForm.formState.errors.username.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="registerPassword" className="form-label">Password</label>
                    <input 
                      type="password" 
                      className={`form-control ${registerForm.formState.errors.password ? 'is-invalid' : ''}`}
                      id="registerPassword"
                      {...registerForm.register('password')}
                    />
                    {registerForm.formState.errors.password && (
                      <div className="invalid-feedback">
                        {registerForm.formState.errors.password.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input 
                      type="password" 
                      className={`form-control ${registerForm.formState.errors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      {...registerForm.register('confirmPassword')}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <div className="invalid-feedback">
                        {registerForm.formState.errors.confirmPassword.message}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : 'Register'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Hero Column */}
        <div className="col-md-7 d-none d-md-flex align-items-center justify-content-center bg-primary text-white p-5">
          <div className="px-4">
            <h1 className="display-4 fw-bold mb-4">AspiraSys Workshop System</h1>
            <p className="fs-5 mb-4">A comprehensive platform for managing technical workshop events, attendees, mentors, and performance tracking.</p>
            
            <div className="row g-4 mt-3">
              <div className="col-md-6">
                <div className="d-flex align-items-start">
                  <div className="bg-white text-primary rounded-circle p-2 me-3">
                    <i className="bi bi-people-fill fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Attendee Management</h5>
                    <p className="mb-0 opacity-75">Track registration, progress, and completion</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="d-flex align-items-start">
                  <div className="bg-white text-primary rounded-circle p-2 me-3">
                    <i className="bi bi-person-check-fill fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Mentor Assignment</h5>
                    <p className="mb-0 opacity-75">Pair mentors with workshop participants</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="d-flex align-items-start">
                  <div className="bg-white text-primary rounded-circle p-2 me-3">
                    <i className="bi bi-clipboard-data fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Task Monitoring</h5>
                    <p className="mb-0 opacity-75">Track completion rates and performance</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="d-flex align-items-start">
                  <div className="bg-white text-primary rounded-circle p-2 me-3">
                    <i className="bi bi-graph-up fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Comprehensive Reports</h5>
                    <p className="mb-0 opacity-75">Generate insights and performance reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}