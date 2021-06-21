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

/**
 * @api {post} /register Register User
 * @apiName RegisterUser
 * @apiDescription Auths an Admin to register a user
 * @apiGroup User
 * @apiVersion  0.1.0
 * @apiPermission admin
 * @apiExample {url} Example usage:
 *     http://localhost:4000/api/register
 * 
 * 
 * @apiuse header
 * 
 * @apiParam  (body) {String} nikcname Nickname of the User
 * @apiParam  (body) {String} password Password ot the User
 * @apiParam  (body) {number} role Role of the User
 * 
 * @apiParamExample  {json} Request-E:
 *      {
 *          "nickname": "padrocha", 
 *          "password": "pass",
 *          "roles": 16
 *      }
 * 
 * @apiuse SuccessToken
 * 
 * @apiuse BadRequest
 * 
 * @apiuse Conflict
 * 
 * @apiuse NoContent
 * 
 * @apiuse HeaderErrors
 */
export async function registerUser({ body, file }: Request, res: Response) {
    let result: UploadApiResponse;

    if (!body) return res.status(400).send({ message: 'Client has not sent params' });

    if (!hasValidRoles(body?.roles))
        return res.status(400).send({ message: 'Roles bundle not supported' });
    else
        body.role = intoRole(body.roles);

    if (file) try {
        result = await v2.uploader.upload(file.path, { folder: 'blog/users' });
        body.image = <IImage>{ public_id: result.public_id, url: result.secure_url, }
    } catch {
        return res.status(409).send({ message: 'Internal error, probably error with params' });
    }

    const newUser = new UserModel(body);
    newUser.save(async (err, userStored: IUser) => {
        if (file) try {
            if (err || !userStored) await v2.uploader.destroy(result.public_id);
            await unlink(file.path);
        } catch {
            await unlink(file.path);
            return res.status(409).send({ message: 'Internal error, probably error with params' });
        }
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!userStored) return res.status(204).send({ message: 'Saved and is not returning any content' });
        delete userStored.password;
        return res.status(200).send({ token: userStored.createToken() });
    });
}

/**
 * @api {post} /login Login User
 * @apiName LoginUser
 * @apiDescription Verify if the user exits and have the correct password
 * @apiGroup User
 * @apiVersion  0.1.0
 * @apiExample {url} Example usage:
 *     http://localhost:4000/api/login
 * 
 * 
 * @apiParam  (body) {String} nikcname Nickname of the User
 * @apiParam  (body) {String} password Password ot the User
 * 
 * @apiParamExample  {json} Request-E:
 *      {
 *          "nickname": "padrocha", 
 *          "password": "pass"
 *      }
 * 
 * @apiuse SuccessToken
 * 
 * @apiuse BadRequest
 * 
 * @apiuse Conflict
 * 
 * @apiuse NotFound
 * 
 * @apiError Unauthorized[U] User are not AUTHed
 * 
 * @apiErrorExample {json} U-R:
 *      HTTP/1.1 401 The user does not have valid authentication credentials for the target resource.
 *      {
 *          "message": "Unauthorized"
 *      }
 */

export function loginUser({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'Client has not sent params' });
    const { nickname, password } = <IUser>body;
    UserModel.findOne({ nickname })
        .select('-image')
        .exec((err, user) => {
            if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
            if (!user) return res.status(404).send({ message: 'Document not found' });
            if (!user.comparePassword(<string>password)) return res.status(401).send({ message: 'Unauthorized' });

            delete user.password;
            console.log("🚀 ~ file: user.ts ~ line 134 ~ .exec ~ user", user)
            return res.status(200).send({ token: user.createToken() });
        });
}
/**
 * @api {get} / Request User Info
 * @apiName ReturnUser
 * @apiDescription AUTH an user to Request his info
 * @apiGroup User
 * @apiVersion  0.1.0
 * @apiPermission user
 * @apiExample {url} Example usage:
 *     http://localhost:4000/api/user
 * 
 * 
 * @apiuse header
 * 
 * @apiSuccess {string} identifier id´s User
 * @apiSuccess {string} nikcname Nickname of the User
 * @apiSuccess {number} role Role of the User
 * 
 * @apiSuccessExample {json} Success-R:
 *      HTTP/1.1 200 OK
 *      {
 *           "identifier": "5e6ceef1cf62796de0e1e791", 
 *           "nickname": "padrocha", 
 *           "role": 16
 *      }
 * 
 * @apiError Auth[AU] Auth failed
 * 
 * @apiErrorExample {json} AU-R:
 *      HTTP/1.1 400 The server cannot or will not process the request due to an apparent client error.
 *      {
 *          "message": "Client has not sent params"
 *      }
 * 
 * @apiuse HeaderErrors
 */

export function returnUser({ user, query }: Request, res: Response) {
    if (query?.nickname && user) {
        UserModel.findOne({ nickname: <string>query.nickname })
            .select(['-password', '-__v'])
            .exec((err, data) => {
                if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
                if (!data) return res.status(404).send({ message: 'Document not found' });
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
        return res.status(400).send({ message: 'User failed to pass authentication' });
}

export function returnAuths({ user }: Request, res: Response) {
    if (!user) return res.status(400).send({ message: 'User failed to pass authentication' });
    const configAuth: { [AUTH: string]: number } = config.AUTH;
    return res.status(200).send({ data: Object.keys(configAuth) });
}