import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { login } from './api';
import { loginFormSchema, type LoginFormValues, type LoginResponse } from './schema';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', senha: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data: LoginResponse) => {
      signIn(data.accessToken, data.usuario);
      navigate('/ordens', { replace: true });
    },
  });

  return (
    <div className="login-screen">
      <div className="card login-card">
        <div className="brand">OVGS</div>
        <p className="subtitle">Sistema de Gestão de Ordens de Venda</p>

        {mutation.isError ? <ErrorAlert error={mutation.error} /> : null}

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="voce@ovgs.dev"
              {...register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="senha" error={errors.senha?.message}>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              {...register('senha')}
            />
          </Field>
          <Button type="submit" disabled={mutation.isPending} style={{ width: '100%', justifyContent: 'center' }}>
            {mutation.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="hint">
          <strong>Credenciais de exemplo</strong>
          <br />
          Operador: operador@ovgs.dev / operador123
          <br />
          Auditor: auditor@ovgs.dev / auditor123
        </div>
      </div>
    </div>
  );
}
