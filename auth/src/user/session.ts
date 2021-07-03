import { jsonEvent, JSONEventType } from "@eventstore/db-client";
import { EventStoreDb } from "../events";
import { v4 as uuid } from 'uuid'
import { AuthenticationError } from "../token";

type SessionParams = {
    githubToken: string,
    userId: string
}

type SessionCreated = JSONEventType<
    'SessionCreated',
    SessionParams
>

export class Session {

    constructor(
        private eventstore: EventStoreDb
    ) { }

    public async createSessionId(params: SessionParams): Promise<string> {
        const id = uuid()
        const streamId = `session:${id}`
        await this.eventstore.addEvent(streamId, jsonEvent<SessionCreated>({
            type: 'SessionCreated',
            data: params
        }))
        return id
    }

    public async getGithubToken(sessionId: string): Promise<string> {
        const streamId = `session:${sessionId}`
        const events = await this.eventstore.getAllEvents<SessionCreated>(streamId)
        if (events.length > 0 && events[0].event) {
            return events[0].event.data.githubToken
        }
        throw new AuthenticationError()
    }


}
