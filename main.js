import FastifyFactory from "fastify"
import FastifyStatic from "@fastify/static"
import Path from "path"
import FS from "fs"
import {fileURLToPath} from "url"

const Fastify = FastifyFactory({logger: false})

const FileName = fileURLToPath(import.meta.url)
const DirectoryName = Path.dirname(FileName)

Fastify.register(FastifyStatic, {
    root: Path.join(DirectoryName, "Images"),
    prefix: "/images/",
})

const ImageDirectory = Path.join(DirectoryName, "Images")

function LoadImages() {
    return FS.readdirSync(ImageDirectory).filter(F => /\.(png|jpg|jpeg|webp|gif|bmp|svg|tif|tiff|avif|ico|heic|heif|jfif)$/i.test(F)).map(File => {
        const FullPath = Path.join(ImageDirectory, File)
        const Stats = FS.statSync(FullPath)

        const DateStr = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/London",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(Stats.mtime)

        return {
            File: File,
            Date: DateStr
        }
    })
}

Fastify.get("/api/images", async (Req, Reply) => {
    const AllImages = LoadImages()

    const Page = Number(Req.query.page) || 1
    const Limit = 72

    const Start = (Page - 1) * Limit
    const End = Start + Limit

    const Slice = AllImages.slice(Start, End)

    return {
        Images: Slice,
        Page: Page,
        HasNext: End < AllImages.length
    }
})

Fastify.get("/", async (Req, Reply) => {
    Reply.type("text/html").send(FS.readFileSync(Path.join(DirectoryName, "index.html"), "utf-8"))
})

Fastify.listen({port: 727}, (Error, Address) => {
    if (Error) {
        Fastify.log.error(Error)
        process.exit(1)
    }

    console.log(`Server Listening At ${Address}`)
})