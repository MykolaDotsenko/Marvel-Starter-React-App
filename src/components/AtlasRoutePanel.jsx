const steps = [
  ["01", "Discover"],
  ["02", "Save"],
  ["03", "Journey"],
  ["04", "Finish"],
];

export const AtlasRoutePanel = () => (
  <aside className="atlas-route-panel" aria-label="Reading Atlas workflow">
    <div className="atlas-route-panel__heading">
      <div>
        <p className="eyebrow">Atlas flow / route 01</p>
        <p className="atlas-route-panel__title">From discovery to finish.</p>
      </div>
      <span className="atlas-route-panel__signal" aria-hidden="true">
        Live route
      </span>
    </div>

    <div className="atlas-route-visual" aria-hidden="true">
      <svg viewBox="0 0 360 210" focusable="false">
        <path
          className="atlas-route-visual__ghost"
          d="M36 158 C82 154 88 74 145 78 S224 166 266 116 S304 50 330 52"
        />
        <path
          className="atlas-route-visual__path"
          pathLength="1"
          d="M36 158 C82 154 88 74 145 78 S224 166 266 116 S304 50 330 52"
        />
        <g className="atlas-route-node atlas-route-node--discover" transform="translate(36 158)">
          <circle r="10" />
          <circle className="atlas-route-node__core" r="3.2" />
        </g>
        <g className="atlas-route-node atlas-route-node--save" transform="translate(145 78)">
          <circle r="10" />
          <circle className="atlas-route-node__core" r="3.2" />
        </g>
        <g className="atlas-route-node atlas-route-node--journey" transform="translate(266 116)">
          <circle className="atlas-route-node__pulse" r="17" />
          <circle r="10" />
          <circle className="atlas-route-node__core" r="3.2" />
        </g>
        <g className="atlas-route-node atlas-route-node--finish" transform="translate(330 52)">
          <circle r="10" />
          <circle className="atlas-route-node__core" r="3.2" />
        </g>
      </svg>

      <ol className="atlas-route-steps">
        {steps.map(([number, label]) => (
          <li key={number}>
            <span>{number}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
    </div>

    <dl className="atlas-route-metrics">
      <div>
        <dt>Archive</dt>
        <dd>37.5K+</dd>
      </div>
      <div>
        <dt>Progress</dt>
        <dd>Local</dd>
      </div>
      <div>
        <dt>Account</dt>
        <dd>None</dd>
      </div>
    </dl>
  </aside>
);
