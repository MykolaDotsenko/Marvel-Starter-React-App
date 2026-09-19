import { useState } from "react";
import { Icon } from "./Icon.jsx";

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
    <form
      className="search-panel"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        runSearch(value);
      }}
    >
      <label className="search-panel__label" htmlFor="issue-search">
        Search Marvel comics
      </label>

      <div className="search-shell">
        <Icon name="search" size={20} className="search-shell__icon" />
        <input
          id="issue-search"
          name="q"
          type="search"
          value={value}
          maxLength={80}
          autoComplete="off"
          placeholder="Search issues, events, runs…"
          aria-describedby={validation ? "search-validation" : "search-hint"}
          onChange={(event) => {
            setValue(event.target.value);
            if (validation) setValidation("");
          }}
        />
        <button className="primary-action search-submit" type="submit" aria-label="Search">
          <Icon name="search" size={17} />
          <span>Search</span>
        </button>
      </div>

      {validation ? (
        <p className="search-form__validation" id="search-validation" role="alert">
          {validation}
        </p>
      ) : (
        <p className="sr-only" id="search-hint">
          Search by comic title. Use at least two characters.
        </p>
      )}

      <div className="quick-searches" aria-label="Quick searches">
        <span>Explore:</span>
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
  );
};
