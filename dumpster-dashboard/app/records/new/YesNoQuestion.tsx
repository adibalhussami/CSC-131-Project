"use client";

import { useState } from "react";

// A required Yes/No question that asks for a written explanation when the answer
// matches `explainWhen`. The explanation is required while it is shown.
export default function YesNoQuestion({ name, label, explainWhen, explainLabel }: {
  name: string; label: string; explainWhen: "yes" | "no"; explainLabel: string;
}) {
  const [answer, setAnswer] = useState("");
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend>{label}</legend>
      <div className="checkbox-row">
        <input id={`${name}-yes`} type="radio" name={name} value="yes" required checked={answer === "yes"} onChange={() => setAnswer("yes")} />
        <label htmlFor={`${name}-yes`} style={{ margin: 0 }}>Yes</label>
        <input id={`${name}-no`} type="radio" name={name} value="no" checked={answer === "no"} onChange={() => setAnswer("no")} />
        <label htmlFor={`${name}-no`} style={{ margin: 0 }}>No</label>
      </div>
      {answer === explainWhen && (
        <div>
          <label htmlFor={`${name}-note`}>{explainLabel}</label>
          <textarea id={`${name}-note`} name={`${name}Note`} rows={2} maxLength={200} required />
        </div>
      )}
    </fieldset>
  );
}
