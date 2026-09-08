import { supabase } from "../lib/supabase.js";
import { prisma } from "../lib/prisma.js";

export async function cadastrarUsuario(
    email: string,
    senha: string
) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: senha
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.user) {
        throw new Error("Usuário não criado");
    }

    await prisma.usuario.create({
        data: {
            id: data.user.id
        }
    });

    return {
        id: data.user.id,
        email: data.user.email
    };
}

export async function autenticarUsuario(
    email: string,
    senha: string
) {
    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password: senha
        });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}