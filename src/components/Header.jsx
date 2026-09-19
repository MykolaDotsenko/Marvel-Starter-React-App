export const Header = ({ favoriteCount }) => (
  <header className="site-header">
    <a className="brand" href="/" aria-label="Marvel Atlas home">
      <span className="brand__mark" aria-hidden="true">MA</span>
      <span>
        <strong>Marvel Atlas</strong>
        <small>Character intelligence</small>
      </span>
    </a>

    <nav className="site-nav" aria-label="Primary navigation">
      <a href="#explorer-title">Explore</a>
      <span className="favorite-pill" aria-label={`${favoriteCount} saved favorites`}>
        <span aria-hidden="true">★</span>
        {favoriteCount}
      </span>
    </nav>
  </header>
);
