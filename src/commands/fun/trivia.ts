import { ApplyOptions } from "@sapphire/decorators";
import { Command, type CommandOptions } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import { buttonCollector } from "../../lib/collectors";
import { fetchJson } from "../../lib/utils/http";
import { randomItem } from "../../lib/utils/misc";
import type { TriviaApiItem, TriviaFetchedQuestion, TriviaQuestion } from "../../typings/api/misc";

const TRIVIA_API_URL = "https://the-trivia-api.com/api/questions";

@ApplyOptions<CommandOptions>({
  description: "Trivia questions!",
  cooldownLimit: 1,
  cooldownDelay: 5000,
  cooldownFilteredUsers: process.env.COOL_PEOPLE_IDS.split(","),
  preconditions: ["NotBlacklisted"],
})
export class TriviaCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option
            .setName("category")
            .setDescription("Question category")
            .setRequired(false)
            .setChoices(
              { name: "Arts and Literature", value: "arts_and_literature" },
              { name: "Film and TV", value: "film_and_tv" },
              { name: "Food and Drink", value: "food_and_drink" },
              { name: "General Knowledge", value: "general_knowledge" },
              { name: "Geography", value: "geography" },
              { name: "History", value: "history" },
              { name: "Music", value: "music" },
              { name: "Science", value: "science" },
              { name: "Society and Culture", value: "society_and_culture" },
              { name: "Sport and Leisure", value: "sport_and_leisure" }
            )
        )
        .addStringOption(option =>
          option
            .setName("difficulty")
            .setDescription("Question difficulty")
            .setRequired(false)
            .setChoices(
              { name: "Easy", value: "easy" },
              { name: "Medium", value: "medium" },
              { name: "Hard", value: "hard" }
            )
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.deferred) await interaction.deferReply();

    const categoryChoice = interaction.options.getString("category");
    const difficultyChoice = interaction.options.getString("difficulty");

    // Resolve random choices using helper
    const category = categoryChoice
      ? categoryChoice
      : randomItem([
          "arts_and_literature",
          "film_and_tv",
          "food_and_drink",
          "general_knowledge",
          "geography",
          "history",
          "music",
          "science",
          "society_and_culture",
          "sport_and_leisure",
        ]);

    const difficulty = difficultyChoice ? difficultyChoice : randomItem(["easy", "medium", "hard"]);

    try {
      const question = await this.getQuestion(category, difficulty);

      if (!question || !question.answers) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("❌ | Failed to fetch trivia question. Please try again later.");
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Create answer buttons. Use index-based custom IDs to avoid embedding the text in the ID.
      const answersRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        ...question.answers.map((ans, idx) =>
          new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel(ans).setCustomId(`${idx}-${interaction.user.id}`)
        )
      );

      const questionEmbed = new EmbedBuilder()
        .setAuthor({
          iconURL: interaction.user.displayAvatarURL({ forceStatic: false }),
          name: `${interaction.user.username}'s Trivia Question:`,
        })
        .setDescription(`${question.question}`)
        .setColor("Random")
        .setFields(
          {
            name: "Difficulty",
            value: question.difficulty.toUpperCase(),
            inline: true,
          },
          {
            name: "Category",
            value: question.category.toUpperCase(),
            inline: true,
          }
        )
        .setFooter({ text: "You have 15s to answer!" });

      const message = await interaction.editReply({
        embeds: [questionEmbed],
        components: [answersRow],
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000,
      });
      buttonCollector.set(interaction.user.id, collector);

      const finishRound = async (selectedIndex: number | null, timedOut = false) => {
        // Update buttons: mark correct as Success, selected as Danger when wrong, others as Secondary
        answersRow.components.forEach((comp, idx) => {
          const isCorrect = question.answers[idx] === question.correctAnswer;
          comp.setDisabled(true);
          if (isCorrect) comp.setStyle(ButtonStyle.Success);
          else if (selectedIndex !== null && idx === selectedIndex && !isCorrect) comp.setStyle(ButtonStyle.Danger);
          else comp.setStyle(ButtonStyle.Secondary);
        });

        if (timedOut) {
          questionEmbed.setColor("Red");
          questionEmbed.setFooter({ text: "Timed out!" });
          await interaction.editReply({
            embeds: [questionEmbed],
            components: [answersRow],
            content: `Timed out! The answer was \`${question.correctAnswer}\`.`,
          });
        } else if (selectedIndex !== null && question.answers[selectedIndex] === question.correctAnswer) {
          questionEmbed.setColor("Green");
          await interaction.editReply({
            embeds: [questionEmbed],
            components: [answersRow],
            content: "You are correct!",
          });
        } else if (selectedIndex !== null) {
          questionEmbed.setColor("Red");
          await interaction.editReply({
            embeds: [questionEmbed],
            components: [answersRow],
            content: `That was incorrect, the answer was \`${question.correctAnswer}\`.`,
          });
        }
      };

      collector.on("collect", async i => {
        const selected = parseInt(i.customId.split("-")[0], 10);

        if (!i.customId.endsWith(i.user.id)) {
          return i.reply({
            content: "This button does not belong to you!",
            ephemeral: true,
          });
        }

        await i.deferUpdate();

        // Stop collector and finish round with the selected index
        collector.stop("End");
        await finishRound(selected, false);
      });

      collector.on("end", async (_collected, reason) => {
        // If collector ended due to timeout, reason will be 'time' (or other) and we should handle timed out.
        if (reason && reason !== "End") {
          await finishRound(null, true);
        }
      });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ | Failed to fetch trivia question. Please try again later.");
      await interaction.editReply({ embeds: [errorEmbed] });
      throw error;
    }
  }

  private async getQuestion(category: string, difficulty: string): Promise<TriviaQuestion | null> {
    let fetched = await this.fetchQuestion(category, difficulty);

    if (!fetched) return null;

    // Retry if any answer is too long for a button label (80 char limit)
    while (fetched.answers.some(a => a.length > 60)) {
      fetched = await this.fetchQuestion(category, difficulty);
      if (!fetched) return null;
    }

    this.container.logger.debug(`Trivia Answer: ${fetched.answers[0]}`);

    // Randomize answer positions
    const indices: number[] = [0, 1, 2, 3];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffled = indices.map(r => fetched.answers[r]);

    return {
      question: fetched.question,
      difficulty: fetched.difficulty,
      category: fetched.category,
      correctAnswer: fetched.answers[0],
      answers: shuffled,
    };
  }

  private async fetchQuestion(category: string, difficulty: string): Promise<TriviaFetchedQuestion | null> {
    const trivia = await fetchJson<TriviaApiItem[]>(
      `${TRIVIA_API_URL}?categories=${category}&limit=1&difficulty=${difficulty}`
    );

    if (!trivia) return null;

    const answers = [trivia[0].correctAnswer, ...trivia[0].incorrectAnswers.slice(0, 3)];

    return {
      question: trivia[0].question,
      difficulty: trivia[0].difficulty,
      category: trivia[0].category,
      answers,
    };
  }
}
