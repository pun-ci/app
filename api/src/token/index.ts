import jwt from 'jsonwebtoken'

export class AuthenticationError extends Error { }

export class Tokens {

    constructor(
        private secret: string
    ) { }

    public createToken(sessionId: string): string {
        return jwt.sign({ sessionId }, this.secret)
    }

    public getSessionIdFromToken(token: string): string {
        const data = jwt.verify(token, this.secret) as { sessionId: string }
        return data.sessionId
    }

}
