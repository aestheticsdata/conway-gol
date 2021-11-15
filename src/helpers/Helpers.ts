class Helpers {
  public static getRequestURL = (url) => window.location.pathname.search('conway-gol') !== -1 ? `http://1991computer.com/conway-gol/api/${url}` : `http://localhost:5030/${url}`;
}

export default Helpers;
