import { UploadApiResponse, v2 } from 'cloudinary';
import { Request, Response } from 'express';
import { unlink } from 'fs-extra';

import { config } from '../config/config';
import { hasValidRoles, intoRole, intoRoles } from '../services/roles'
import { IImage } from '../models/image';
import { UserModel, IUser } from '../models/user';

v2.config({
    cloud_name: config.CLOUDINARY.NAME,
    api_key: config.CLOUDINARY.KEY,
    api_secret: config.CLOUDINARY.SECRET,
});

export async function registerUser({ body, file }: Request, res: Response) {
    let result: UploadApiResponse;

    if (!body) return res.status(400).send({ message: 'El cliente no ha enviado parámetros' });

    if (!hasValidRoles(body?.roles) && body?.roles)
        return res.status(400).send({ message: 'Paquete de roles no compatible' });
    else if (body?.roles)
        body.role = intoRole(body.roles);

    if (file) try {
        result = await v2.uploader.upload(file.path, { folder: 'blog/users' });
        body.image = <IImage>{ public_id: result.public_id, url: result.secure_url, }
    } catch {
        return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
    }

    const newUser = new UserModel(body);
    newUser.save(async (err, userStored: IUser) => {
        console.log("🚀 ~ file: user.ts ~ line 35 ~ newUser.save ~ err", err)
        if (file) try {
            if (err || !userStored) await v2.uploader.destroy(result.public_id);
            await unlink(file.path);
        } catch {
            await unlink(file.path);
            return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
        }
        if (err) return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
        if (!userStored) return res.status(204).send({ message: 'Saved and is not returning any content' });
        delete userStored.password;
        return res.status(200).send({ token: userStored.createToken() });
    });
}

export function loginUser({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'El cliente no ha enviado parámetros' });
    const { nickname, password } = <IUser>body;
    UserModel.findOne({ nickname })
        .select('-image')
        .exec((err, user) => {
            if (err) return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
            if (!user) return res.status(404).send({ message: 'Documento no encontrado' });
            if (!user.comparePassword(<string>password)) return res.status(401).send({ message: 'No autorizado' });

            delete user.password;
            console.log("🚀 ~ file: user.ts ~ line 134 ~ .exec ~ user", user)
            return res.status(200).send({ token: user.createToken() });
        });
}

export function returnUser({ user, query }: Request, res: Response) {
    if (query?.nickname && user) {
        UserModel.findOne({ nickname: <string>query.nickname })
            .select(['-password', '-__v'])
            .exec((err, data) => {
                if (err) return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
                if (!data) return res.status(404).send({ message: 'Documento no encontrado' });
                const user = data.toObject();
                const identifier = user._id;
                const roles = intoRoles(<number>user.role);
                delete user._id;
                delete user.role;
                return res.status(200).send({
                    identifier,
                    ...user,
                    roles
                });
            });
    } else if (user) {
        const data = user.toObject();
        const identifier = data._id;
        const roles = intoRoles(<number>data.role);
        delete data._id;
        delete data.role;
        return res.status(200).send({
            identifier,
            ...data,
            roles,
        });
    } else
        return res.status(400).send({ message: 'El usuario no pudo pasar la autenticación' });
}

export function returnAuths({ user }: Request, res: Response) {
    if (!user) return res.status(400).send({ message: 'El usuario no pudo pasar la autenticación' });
    const configAuth: { [AUTH: string]: number } = config.AUTH;
    return res.status(200).send({ data: Object.keys(configAuth) });
}

export function listUser({ }: Request, res: Response) {
    UserModel.find().exec((err, user) => {
        if (err) return res.status(409).send({ message: 'Error interno, probablemente error con los parámetros' });
        if (!user) return res.status(404).send({ message: 'Documento no encontrado' });
        return res.status(200).send({ data: user.map(({ _id, nickname, role }) => ({ identifier: _id, nickname, roles: intoRoles(<number>role) })) });
    });
}
