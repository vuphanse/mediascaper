import {Ipath, IPathRoute} from "../domain/IPath";

function path(url: string): IPathRoute {
    const allRoutes: Ipath = {
        "/scrape": {
            methods: ["POST", "GET"]
        },
    };
    
    return allRoutes[url];
}

export default path;
