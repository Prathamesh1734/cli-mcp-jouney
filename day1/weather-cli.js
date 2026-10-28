import { Command } from "commander";
let program = new Command();

program
  .name("weather-cli")
  .description("simple cli to check weather")
  .version("1.0.0");

program
  .command("check")
  .description("check weather for a city")
  .argument("<city>", "name of the city")
  .action((city) => console.log(`weather in the ${city} is sunny and 25C`));

program.parse();
