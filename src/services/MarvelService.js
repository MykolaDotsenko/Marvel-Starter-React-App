
class MarvelService {
    getResources = async(url) => {
       let res = await fetch(url);

       if(!res.ok){
        throw new Error(`Error:Could not fetch ${url}, status: ${res.status} `);
       }
       return await res.json();
    }
    getAllCharacters = () => {
        return this.getResource();
    }

}