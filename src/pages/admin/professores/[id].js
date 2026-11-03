import Head from "next/head";
import { useRouter } from "next/router";
import AdminProfessorForm from "../../../components/AdminProfessorForm";

export default function EditarProfessor() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  return (
    <>
      <Head>
        <title>Editar professor | Administração Zooly</title>
      </Head>
      {id ? <AdminProfessorForm professorId={id} /> : null}
    </>
  );
}
