import { useState } from "react";

export const SearchPanel = ({ activeQuery, onSubmit, quickSearches }) => {
  const [value, setValue] = useState(activeQuery);
  const [validation, setValidation] = useState("");

  const runSearch = (query) => {
    const normalized = query.trim().replace(/\s+/g, " ");

    if (normalized.length === 1) {
      setValidation("Use at least 2 characters for title search.");
      return;
    }

    setValidation("");
    onSubmit(normalized);
  };

  return (
    <section className="search-panel" aria-labelledby="search-title">
      <div className="search-panel__intro">
        <p className="eyebrow">Query 37,500+ issues</p>
        <h2 id="search-title">Find the next comic worth reading.</h2>
        <p>
          Full-text title search surfaces original runs before reprints. Empty
          search returns the newest indexed issues.
        </p>
      </div>

      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(value);
        }}
      >
        <label htmlFor="issue-search">Comic title</label>
        <div className="search-form__row">
          <input
            id="issue-search"
            name="q"
            type="search"
            value={value}
            maxLength={80}
            autoComplete="off"
            placeholder="Try Secret Wars, Daredevil, X-Men…"
            aria-describedby={validation ? "search-validation" : undefined}
            onChange={(event) => {
              setValue(event.target.value);
              if (validation) setValidation("");
            }}
          />
          <button className="primary-action" type="submit">Search</button>
        </div>

        {validation ? (
          <p className="search-form__validation" id="search-validation" role="alert">
            {validation}
          </p>
        ) : null}

        <div className="quick-searches" aria-label="Quick searches">
          <span>Quick:</span>
          {quickSearches.map((query) => (
            <button
              key={query}
              type="button"
              className={activeQuery === query ? "is-active" : ""}
              aria-pressed={activeQuery === query}
              onClick={() => {
                setValue(query);
                runSearch(query);
              }}
            >
              {query}
            </button>
          ))}
          {activeQuery ? (
            <button
              type="button"
              className="quick-searches__clear"
              onClick={() => {
                setValue("");
                setValidation("");
                onSubmit("");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
};
