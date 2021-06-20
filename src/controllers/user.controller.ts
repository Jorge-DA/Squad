import { Request, Response } from 'express';

import User, { IUser } from '../models/user';
import createToken from '../services/jwt';


/*------------------------------------------------------------------*/
// * Controlador de user.js
/*------------------------------------------------------------------*/

/**
 * 
 * @api {post} /register Register User
 * @apiName RegisterUser
 * @apiDescription AUTHs an Admin to register a user
 * @apiGroup User
 * @apiVersion  0.1.0
 * @apiPermission admin
 * @apiExample {url} Example usage:
 *     http://localhost:4000/api/register
 * 
 * 
 * @apiParam  (body) {String} nikcname Nickname of the User.
 * @apiParam  (body) {String} password Password ot the User
 * @apiParam  (body) {number} role Role of the User
 * 
 * @apiParamExample  {json} Request-E:
 *      {
 *          "nickname": "padrocha", 
 *          "password": "pass",
 *          "role": 16
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
 * 
 */

export function registerUser({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'Client has not sent params' });
    const newUser = new User(body);
    newUser.save((err, userStored: IUser) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        else if (!userStored) return res.status(204).send({ message: 'Saved and is not returning any content' });
        else {
            delete userStored.password;
            return res.status(200).send({ token: createToken(userStored) });
        }
    });
}

/**
 * 
 * @api {post} /login Login User
 * @apiName LoginUser
 * @apiDescription Verify if the user exits and have the correct password
 * @apiGroup User
 * @apiVersion  0.1.0
 * @apiExample {url} Example usage:
 *     http://localhost:4000/api/login
 * 
 * 
 * @apiParam  (body) {String} nikcname Nickname of the User.
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
 * 
 */

export function loginUser({ body }: Request, res: Response) {
    if (!body) return res.status(400).send({ message: 'Client has not sent params' });
    const { nickname, password } = <IUser>body;
    User.findOne({ nickname }).select('-password').exec((err, user: IUser) => {
        if (err) return res.status(409).send({ message: 'Internal error, probably error with params' });
        if (!user) return res.status(404).send({ message: 'Document not found' });
        if (!user.comparePassword(password)) return res.status(401).send({ message: 'Unauthorized' });

        return res.status(200).send({ token: createToken(user) });
    });
}

/**
 * 
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
 * @apiSuccess {string} identifier id´s User.
 * @apiSuccess {string} nikcname Nickname of the User.
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
 * 
 */

export function returnUser({ user }: Request, res: Response) {
    if (!user) return res.status(400).send({ message: 'User failed to pass authentication' });
    const { _id, nickname, role } = <IUser>user;
    return res.status(200).send({ identifier: _id, nickname, role });
}