import Head from "next/head";
import AdminProfessorForm from "../../../components/AdminProfessorForm";

export default function NovoProfessor() {
  return (
    <>
      <Head>
        <title>Novo professor | Administração Zooly</title>
      </Head>
      <AdminProfessorForm />
    </>
  );
}
