import { v4 as uuid } from 'uuid'
import { AuthenticationError } from "../token";
import { Event, EventStore, EventStream } from "@pun-ci/eventstore";

type SessionParams = {
    githubToken: string,
    userId: string
}

type SessionCreated = Event<'SessionCreated', SessionParams>
type SessionDeleted = Event<'SessionDeleted', {}>
type SessionEvent = SessionCreated | SessionDeleted

export class Session {

    constructor(
        private eventstore: EventStore
    ) { }

    private getStreamId(sessionId: string): string {
        return `session:${sessionId}`
    }

    public async createSessionId(params: SessionParams): Promise<string> {
        const id = uuid()
        await this.eventStream(id).addEvent({
            type: 'SessionCreated',
            data: params
        })
        return id
    }

    public async getGithubToken(sessionId: string): Promise<string> {
        const result = await this.eventStream(sessionId)
            .reduce<string | null>(null, {
                SessionCreated: ({ githubToken }) => githubToken,
                SessionDeleted: () => null
            })
        if (result === null) {
            throw new AuthenticationError()
        }
        return result
    }

    public async delete(sessionId: string): Promise<void> {
        await this.eventStream(this.getStreamId(sessionId))
            .addEvent({
                type: 'SessionDeleted',
                data: {}
            })
    }

    private eventStream(id: string): EventStream<SessionEvent> {
        return this.eventstore.stream<SessionEvent>(this.getStreamId(id))
    }
}
