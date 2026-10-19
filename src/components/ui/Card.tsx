import {
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/classNames";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: CardProps) {
  const titleId = useId();

  return (
    <section
      className={cn("card", className)}
      aria-labelledby={title ? titleId : undefined}
      {...props}
    >
      {(title || actions) && (
        <div className="card__header">
          <div>
            {title && (
              <h2 className="card__title" id={titleId}>
                {title}
              </h2>
            )}
            {description && <p className="card__description">{description}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}
