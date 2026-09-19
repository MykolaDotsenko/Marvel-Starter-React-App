import { useState } from "react";

export const SearchPanel = ({ activeQuery, onSubmit, quickSearches }) => {
  const [value, setValue] = useState(activeQuery);

  const submit = (event) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <section className="search-panel" aria-labelledby="search-title">
      <div className="search-panel__intro">
        <p className="eyebrow">Query the universe</p>
        <h2 id="search-title">Find a character by name</h2>
        <p>
          Search uses Marvel&apos;s prefix index. Empty search returns the
          canonical alphabetical feed.
        </p>
      </div>

      <form className="search-form" role="search" onSubmit={submit}>
        <label htmlFor="character-search">Character name</label>
        <div className="search-form__row">
          <input
            id="character-search"
            name="q"
            type="search"
            value={value}
            maxLength={80}
            autoComplete="off"
            placeholder="Try Spider, Iron, Storm…"
            onChange={(event) => setValue(event.target.value)}
          />
          <button className="primary-action" type="submit">
            Search
          </button>
        </div>
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
                onSubmit(query);
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
