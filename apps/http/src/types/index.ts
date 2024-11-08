import z from "zod";

export const SignupSchema = z.object({
    username: z.string().email(),
    password: z.string().min(8),
    type: z.enum(["user", "admin"])
});

export const SigninSchema = z.object({
    username: z.string(),
    password: z.string()
});

export const UpdateMetadataSchema = z.object({
    avatarId: z.string()
});

export const CreateSpaceSchema = z.object({
    name: z.string(),
    // TODO : Custom function that validates 10^5x10^5 schema
    dimensions: z.string().regex(/^[0-9]{1,5}x[0-9]{1,5}$/),
    mapId: z.string()
})

export const AddElementSchema = z.object({
    spaceId: z.string(),
    elementId: z.string(),
    x: z.number(),
    y: z.number()
});

export const CreateElementSchema = z.object({
    imageUrl: z.string(),
    width: z.number(),
    height: z.number(),
    static: z.number()
})

export const UpdateElementSchema = z.object({
    imageUrl: z.string()
})

export const CreateAvatarSchema = z.object({
    name: z.string(),
    imageUrl: z.string()
})

export const CreateMapSchema = z.object({
    thumbnail: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,5}x[0-9]{1,5}$/),
    defaultElements: z.array(z.object({
        elementId: z.string(),
        x: z.number(),
        y: z.number()
    }))
})