import { Router } from "express";
import { AddElementSchema, CreateSpaceSchema, DeleteElementSchema } from "../../types";
import client from '@spaced/db/client';
import { userMiddleware } from "../../middleware/user";
export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
    const parsedData = CreateSpaceSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Validation Failed" });
        return;
    }

    if (!parsedData.data.mapId) {
        await client.space.create({
            data: {
                name: parsedData.data.name,
                width: parseInt(parsedData.data.dimensions.split("x")[0]),
                height: parseInt(parsedData.data.dimensions.split("x")[1]),
                creatorId: req.userId as string
            }
        })
        res.json({ message: "Space created" });
        return;
    }

    const map = await client.map.findUnique({
        where: {
            id: parsedData.data.mapId
        },
        select: {
            mapElements: true,
            height: true,
            width: true
        }
    })
    if (!map) {
        res.status(404).json({ message: "Map not found" });
        return;
    }

    let space = await client.$transaction(async () => {
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width: map.width,
                height: map.height,
                creatorId: req.userId as string
            }
        });

        await client.spaceElements.createMany({
            data: map.mapElements.map(e => ({
                spaceId: space.id,
                elementId: e.elementId,
                x: e.x!,
                y: e.y!
            }))
        })
        return space;
    });

    res.json({ spaceId: space.id });
});
spaceRouter.delete("/:spaceId", userMiddleware, async (req, res) => {
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId
        },
        select: {
            creatorId: true
        }
    })

    if (!space) {
        res.status(400).json({ message: "Space not found" });
        return;
    }

    if (space.creatorId !== req.userId) {
        res.status(403).json({ message: "You do not have permission to delete this space" });
        return;
    }

    await client.space.delete({
        where: {
            id: req.params.spaceId
        }
    })

    res.json({ message: "Space deleted" });
});
spaceRouter.get("/all", userMiddleware, async (req, res) => {
    const spaces = await client.space.findMany({
        where: {
            creatorId: req.userId
        }
    });

    res.json({
        spaces: spaces.map(x => ({
            id: x.id,
            name: x.name,
            thumbnail: x.thumbnail,
            dimensions: `${x.width}x${x.height}`
        }))
    });
});

spaceRouter.post("/element", userMiddleware, async (req, res) => {
    const parsedData = AddElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Validation Failed" });
        return;
    }

    const space = await client.space.findUnique({
        where: {
            id: req.body.spaceId,
            creatorId: req.userId
        },
        select: {
            width: true,
            height: true
        }
    });

    if (!space) {
        res.status(404).json({ message: "Space not found" });
        return;
    }

    const element = await client.spaceElements.create({
        data: {
            spaceId: parsedData.data.spaceId,
            elementId: parsedData.data.elementId,
            x: parsedData.data.x,
            y: parsedData.data.y
        }
    });


});
spaceRouter.delete("/element", userMiddleware, async (req, res) => {
    const parsedData = DeleteElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Validation Failed" });
        return;
    }

    const spaceElement = await client.spaceElements.findUnique({
        where: {
            id: parsedData.data.id,
        },
        include: {
            space: true
        }
    });

    if (!spaceElement?.space.creatorId || spaceElement?.space.creatorId !== req.userId) {
        res.status(403).json({ message: "Unauthirized" });
        return;
    }

    await client.spaceElements.delete({
        where: {
            id: parsedData.data.id
        }
    });

    res.json({ message: "Element deleted" });
});

spaceRouter.get("/:spaceId", userMiddleware, async (req, res) => {
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId
        },
        include: {
            elements: {
                include: {
                    element: true
                }
            }
        }
    })

    if (!space) {
        res.status(404).json({ message: "Space not found" });
        return;
    }

    res.json({
        "dimensions": `${space.width}x${space.height}`,
        elements: space.elements.map(e => ({
            id: e.id,
            element: {
                id: e.element.id,
                imageUrl: e.element.imageUrl,
                width: e.element.width,
                height: e.element.height,
                static: e.element.static
            },
            x: e.x,
            y: e.y
        }))
    })
});
