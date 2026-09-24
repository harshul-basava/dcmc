/**
 * A rating question. Radios styled as stars (or as digits for 0–10 scales), so
 * it stays a native, keyboard-navigable radio group and needs no JavaScript.
 */
export default function RatingScale({
  name,
  legend,
  required = true,
  minimum = 1,
  maximum = 5,
  leftLabel = "Not valuable",
  rightLabel = "Extremely valuable",
  kind = "stars",
}: {
  name: string;
  legend: string;
  required?: boolean;
  minimum?: number;
  maximum?: number;
  leftLabel?: string;
  rightLabel?: string;
  kind?: "stars" | "numbers";
}) {
  const values = Array.from({ length: maximum - minimum + 1 }, (_, i) => minimum + i);

  return (
    <fieldset className={`rating-kind-${kind}`}>
      <legend className="mb-2 text-sm text-foreground">
        {legend}
        {required ? (
          <span aria-hidden="true" className="text-accent">
            {" "}*
          </span>
        ) : null}
      </legend>

      <div className="rating-scale">
        {values.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name={name}
              value={value}
              required={required}
              aria-label={`${value} out of ${maximum}`}
            />
            <span aria-hidden="true">{kind === "numbers" ? value : "★"}</span>
          </label>
        ))}
      </div>

      <div aria-hidden="true" className="mt-1.5 flex justify-between text-[0.6875rem] text-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </fieldset>
  );
}
