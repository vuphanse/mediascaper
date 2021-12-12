export interface IConfigs {
    mongodb: IMongo,
    authusers: IUser[],
}

interface IMongo {
    url: string,
    port: number,
    username: string,
    password: string,
    collection: string,
}

interface IUser {
    username: string;
    password: string;
}
