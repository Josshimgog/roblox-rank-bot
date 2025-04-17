const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const GROUP_ID = '13874159'; // Example: 1234567

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!proinfo') || message.author.bot) return;

    const args = message.content.split(' ');
    const username = args[1];

    if (!username) {
        return message.reply('❌ Please provide a Roblox username.');
    }

    try {
        // Step 1: Get UserId from username
        const userIdRes = await fetch('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usernames: [username],
                excludeBannedUsers: true,
            }),
        });
        const userIdData = await userIdRes.json();

        if (!userIdData.data || userIdData.data.length === 0) {
            return message.reply('❌ Username not found.');
        }

        const userId = userIdData.data[0].id;

        // Step 2: Get user's role in group
        const groupRes = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
        const groupData = await groupRes.json();
        const groupInfo = groupData.data.find(group => group.group.id == GROUP_ID);

        const roleName = groupInfo ? groupInfo.role.name : 'Not in group';

        // Step 3: Get avatar
        const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;

        // Step 4: Send embed
        const embed = new EmbedBuilder()
            .setTitle('👤 Roblox Group Rank Info')
            .setThumbnail(avatarUrl)
            .addFields(
                { name: 'Username', value: username, inline: true },
                { name: 'Group ID', value: GROUP_ID, inline: true },
                { name: 'Rank', value: roleName, inline: false },
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setColor(0x00b0f4)
            .setTimestamp();

        message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);
        message.reply('⚠️ Something went wrong while fetching data.');
    }
});

client.login(process.env.TOKEN);