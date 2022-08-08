// ==UserScript==
// @name         RSSchool score shower
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Show your score in first row of score
// @author       Andronio
// @match        https://app.rs.school/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rs.school
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let flag = false;

    const observer = new MutationObserver(callback);

    const config = {
        childList: true,
        subtree: true,
    }
    observer.observe(document.body, config);

    function callback(record) {
        if (location.pathname.startsWith('/course/score')) {
            const elFirst = document.querySelector('tr[aria-hidden="true"]');
            const elMy = document.querySelector('.rsschool-first-row-adder');
            if (elFirst && !elMy && !flag) {
                flag = true;
                setTimeout(() => {flag = false}, 5000);
                main();
            }
        }
    }

    async function main() {
        const myCourse = window.__NEXT_DATA__.props.pageProps.course // Текущий курс
        ? window.__NEXT_DATA__.props.pageProps.course.id
        : window.__NEXT_DATA__.props.pageProps.courses.filter((el) => !el.completed)[0].id;

        const getURL = async (url) =>
        fetch(url, {
            credentials: 'include',
        }).then((resp) => resp.json());

        const man = await getURL('https://app.rs.school/api/session');
        const user = man.data.githubId;

        const urls = [
            `https://app.rs.school/api/course/${myCourse}/student/${user}/summary`,
            `https://app.rs.school/api/v2/courses/${myCourse}/tasks`,
            `https://app.rs.school/api/profile/info?githubId=${user}`,
        ];

        const [summary, tasks, github] = await Promise.all(urls.map((url) => getURL(url)));

        const beforeRow = document.querySelector('tr[aria-hidden="true"]');
        const row = document.createElement('tr');
        row.className = 'rsschool-first-row-adder ant-table-row ant-table-row-level-0';
        row.setAttribute('data-row-key', user);
        row.innerHTML = `<td class="ant-table-cell ant-table-selection-column ant-table-cell-fix-left" style="position: sticky; left: 0px;"/>
  <td class="ant-table-cell ant-table-cell-fix-left" style="position: sticky; left: 0px;">${summary.data.rank}</td>
  <td class="ant-table-cell ant-table-cell-fix-left ant-table-cell-fix-left-last" style="position: sticky; left: 50px;">
    <div><span class="ant-avatar ant-avatar-circle ant-avatar-image" style="width: 24px; height: 24px; line-height: 24px; font-size: 18px;">
        <img src="https://cdn.rs.school/${user}.png?size=48"></span>&nbsp;
      <a target="_blank" href="https://github.com/${user}">${user}</a>
    </div>
  </td>
  <td class="ant-table-cell"><a href="/profile?githubId=${user}">${github.data.generalInfo.name}</a></td>
  <td class="ant-table-cell">${github.data.generalInfo.location.cityName}</td>
  <td class="ant-table-cell">
    <span class="ant-typography"><strong>${summary.data.totalScore}</strong></span></td>`;
        const cross = tasks.filter((task) => task.checker === 'crossCheck');
        const crossTotal = summary.data.results
        .filter((task) => cross.findIndex(taskName => taskName.id === task.courseTaskId) > -1)
        .reduce((acc, cur) => {
            const weight = cross.find(task => task.id === cur.courseTaskId);
            return acc + cur.score * weight.scoreWeight;
        }, 0);

        row.innerHTML += `
  	<td class="ant-table-cell">
      <span class="ant-typography"><strong>${crossTotal}</strong></span>
    </td>`;
        tasks.forEach(task => {
            const t = summary.data.results.find((taskScore) => taskScore.courseTaskId === task.id);
            const score = t ? t.score : 0;
            row.innerHTML += `
      <td class="ant-table-cell align-right"><div>${score}</div></td>`;
        })
        const mentor = summary.data.mentor.githubId;
        const mentorName = mentor ? mentor : '';
        row.innerHTML += `
  <td class="ant-table-cell">2022-08-03</td>
  <td class="ant-table-cell">2022-08-03</td>`;
        if (mentor) {
            row.innerHTML += `
    <td class="ant-table-cell"><a href="/profile?githubId=${mentor}">${mentor}</a></td>`;
        } else {
            row.innerHTML += `
    <td class="ant-table-cell"></td>`;
        }
        row.innerHTML += `
    <td class="ant-table-cell ant-table-cell-fix-right ant-table-cell-fix-right-first" style="text-align: center; position: sticky; right: 0px;"/>
  `;
        beforeRow.after(row);
    }
})();
