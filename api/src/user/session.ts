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

type SessionDeleted = JSONEventType<
    'SessionDeleted',
    {}
>

export class Session {

    constructor(
        private eventstore: EventStoreDb
    ) { }

    private getStreamId(sessionId: string): string {
        return `session:${sessionId}`
    }

    public async createSessionId(params: SessionParams): Promise<string> {
        const id = uuid()
        await this.eventstore.addEvent(this.getStreamId(id), jsonEvent<SessionCreated>({
            type: 'SessionCreated',
            data: params
        }))
        return id
    }

    public async getGithubToken(sessionId: string): Promise<string> {
        const streamId = `session:${sessionId}`
        const events = await this.eventstore.getAllEvents<SessionCreated | SessionDeleted>(streamId)
        if (events.length === 0) {
            throw new AuthenticationError()
        }
        for (const event of events) {
            if (event.type === 'SessionDeleted') {
                throw new AuthenticationError()
            }
        }
        const lastEvent = events.pop()
        if (lastEvent?.type === 'SessionCreated') {
            return lastEvent.data.githubToken
        }
        throw new AuthenticationError()
    }

    public async getUserId(sessionId: string): Promise<string> {
        const streamId = `session:${sessionId}`
        const events = await this.eventstore.getAllEvents<SessionCreated | SessionDeleted>(streamId)
        if (events.length === 0) {
            throw new AuthenticationError()
        }
        for (const event of events) {
            if (event.type === 'SessionDeleted') {
                throw new AuthenticationError()
            }
        }
        const lastEvent = events.pop()
        if (lastEvent?.type === 'SessionCreated') {
            return lastEvent.data.userId
        }
        throw new AuthenticationError()
    }

    public async delete(sessionId: string): Promise<void> {
        await this.eventstore.addEvent(this.getStreamId(sessionId), jsonEvent<SessionDeleted>({
            type: 'SessionDeleted',
            data: {}
        }))
    }

}
