use std::process::Command as ShellCommand;
use uuid::Uuid;
use std::fs::{File, create_dir};
use std::io::{LineWriter, Write};

struct Command {
    cmd: String,
    name: String,
}

struct JobDefinition {
    image: String,
    commands: Vec<Command>,
}

struct JobRun {
    id: Uuid,
    definition: JobDefinition
}

fn run_job(job: JobDefinition) {
    let run = JobRun {
        id: Uuid::new_v4(),
        definition: job
    };
    println!("{:?}", &run.id.to_string());

    create_dir("/tmp/punci_run/".to_owned() + &run.id.to_string()).unwrap();
    create_dir("/tmp/punci_run/".to_owned() + &run.id.to_string()  + "/workdir").unwrap();
    create_dir("/tmp/punci_run/".to_owned() + &run.id.to_string() + "/logs").unwrap();

    for (idx, command) in run.definition.commands.iter().enumerate() {
        let docker_command = "docker run -v /tmp/punci1:/punci_run -w=\"/punci_run/".to_owned()
            + &run.id.to_string() + "/workdir\" " + &run.definition.image.to_string()
            + " " + &command.cmd.to_string();

        let file = File::create(
            "/tmp/punci_run/".to_owned() + &run.id.to_string() + "/logs/"
            + &idx.to_string() + ".log"
        ).unwrap();
        let mut file = LineWriter::new(file);

        let command_result = ShellCommand::new("sh")
            .arg("-c")
            .arg(docker_command)
            .output()
            .unwrap();
        let result_stdout = std::str::from_utf8(&command_result.stdout).unwrap();
        let result_stderr = std::str::from_utf8(&command_result.stderr).unwrap();
        file.write_all(result_stderr.as_bytes());
        file.write_all(result_stdout.as_bytes());
        file.flush();
        println!("{:?}", idx.to_string());
        println!("{:?}", result_stderr.to_string());
        println!("{:?}", result_stdout.to_string());
    }
}

fn main() {
    let job = JobDefinition {
        image: String::from("node:current-alpine3.14"),
        commands: vec![
            Command {
                cmd: String::from("touch punci"),
                name: String::from("Touch"),
            },
            Command {
                cmd: String::from("ls -la"),
                name: String::from("List files"),
            },
        ]
    };

    run_job(job);
}
