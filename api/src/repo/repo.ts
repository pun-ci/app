import { jsonEvent, JSONEventType } from "@eventstore/db-client";
import { EventStoreDb } from "../events";
import { v4 as uuid } from 'uuid'

type RepoCreated = JSONEventType<
    'RepoCreated',
    {
        id: string,
        githubRepoId: number,
    }
>

export class Repos {

    constructor(
        private eventstore: EventStoreDb
    ) { }

    public async addRepo(userId: string, githubRepoId: number): Promise<void> {
        const streamId = `repo-user${userId}`;
        // const events = await this.eventstore.getAllEvents<UserCreated>(streamId)
        // if (events.length > 0) {
        //     return events[0].data.id
        // }
        const id = uuid()
        await this.eventstore.addEvent(streamId, jsonEvent<RepoCreated>({
            type: 'RepoCreated',
            data: {
                githubRepoId,
                id
            }
        }))
    }

}
