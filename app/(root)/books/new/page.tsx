import UploadForm from "@/components/UploadForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
    const { userId } = await auth();
    if (!userId) redirect("/");

    return (
        <main className="new-book">
            <section className="flex flex-col gap-5 text-center">
                <h1 className="page-title-xl">Add a New Book</h1>
                <p className="subtitle">Upload a PDF to generate your interactive reading experience</p>
            </section>

            <UploadForm />
        </main>
    )
}

export default Page