import { jsonEvent, JSONEventType } from "@eventstore/db-client";
import { EventStoreDb } from "../events";
import { v4 as uuid } from 'uuid'

type UserCreated = JSONEventType<
    'UserCreated',
    {
        id: string,
        githubUserId: number,
    }
>

export class Users {

    constructor(
        private eventstore: EventStoreDb
    ) { }

    public async getUserIdByGithubUserId(githubUserId: number): Promise<string> {
        const streamId = `user-gh:${githubUserId}`;
        const events = await this.eventstore.getAllEvents<UserCreated>(streamId)
        console.log({events})
        if (events.length > 0) {
            return events[0].data.id
        }
        const id = uuid()
        await this.eventstore.addEvent(streamId, jsonEvent<UserCreated>({
            type: 'UserCreated',
            data: {
                githubUserId,
                id
            }
        }))
        return id
    }

}
