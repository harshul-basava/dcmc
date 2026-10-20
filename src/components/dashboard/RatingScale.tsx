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
  defaultValue,
  allowSkip = false,
  showOptional = false,
}: {
  name: string;
  legend: string;
  required?: boolean;
  minimum?: number;
  maximum?: number;
  leftLabel?: string;
  rightLabel?: string;
  kind?: "stars" | "numbers";
  defaultValue?: number;
  allowSkip?: boolean;
  showOptional?: boolean;
}) {
  const values = Array.from({ length: maximum - minimum + 1 }, (_, i) => minimum + i);

  return (
    <fieldset className={`rating-kind-${kind}`}>
      <legend className={`mb-2 text-sm text-foreground ${showOptional ? "w-full" : ""}`}>
        {showOptional && !required ? <span className="rating-optional">Optional</span> : null}
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
              defaultChecked={value === defaultValue}
              required={required}
              aria-label={`${value} out of ${maximum}`}
            />
            <span aria-hidden="true">{kind === "numbers" ? value : "★"}</span>
          </label>
        ))}
      </div>

      {/* The end labels explain an unfamiliar scale; on a plain "how good was
          it" star row they only restate the stars. */}
      {leftLabel || rightLabel ? (
        <div aria-hidden="true" className="rating-endpoints mt-1.5 flex justify-between text-[0.6875rem] text-muted">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      ) : null}
      {allowSkip && !required ? <label className="mt-3 flex min-h-10 items-center gap-2 text-xs text-muted">
        <input type="radio" name={name} value="" defaultChecked={defaultValue === undefined} />
        Didn’t attend / skip
      </label> : null}

    </fieldset>
  );
}
