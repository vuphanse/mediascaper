let base64 = require('base-64');

export default async function Get(
    url: string,
    headers:Record<string, unknown> = {}
): Promise<any>{
    try {
        const response: Response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                "Authorization": "Basic " + base64.encode("superuser:superpassword"),
                ...headers
            },
        });
        return response.json();
    } catch (e) {
        throw new Error(e);
    }
}
