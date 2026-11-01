import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
  statusText?: string;
  statusRole?: 'status' | 'alert';
};

export function CapabilityCard({ title, description, children, statusText, statusRole }: Props) {
  const content = statusText ? (
    statusRole === 'alert' ? <div role="alert">{statusText}</div> : <p role="status">{statusText}</p>
  ) : children;

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {content}
      </div>
    </section>
  );
}
