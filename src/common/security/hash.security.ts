import * as bcrypt from "bcrypt"

export const Hash = ({plain_text, salt_rounds = Number(process.env.SALT_ROUNDS)}: {plain_text: string, salt_rounds?: number}) => {
    return bcrypt.hashSync(plain_text, salt_rounds)
}

export const Compare = ({plain_text, cipher_text}: {plain_text: string, cipher_text: string}) => {
    return bcrypt.compareSync(plain_text, cipher_text)
}