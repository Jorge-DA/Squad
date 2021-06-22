import { Document, Model, model, Schema } from 'mongoose';

export interface ITag extends Document {
    readonly name: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface ITagModel extends Model<ITag> {

}

const tagSchema = new Schema<ITag, ITagModel>({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
}, {
    timestamps: true,
    autoIndex: true,
});

/*------------------------------------------------------------------*/

export const TagModel = model<ITag, ITagModel>('Tag', tagSchema);

TagModel.createIndexes();