/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameMonth,
  parseISO,
  isToday,
} from 'date-fns';

import selectors from '../../../selectors';
import Card from '../../cards/Card';

import styles from './CalendarView.module.scss';

const CalendarView = React.memo(({ cardIds }) => {
  const [t] = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  // Get all cards with their data
  const cardsWithDates = useSelector((state) => {
    return cardIds
      .map((cardId) => {
        const card = selectCardById(state, cardId);
        return {
          id: cardId,
          dueDate: card.dueDate,
          isDueCompleted: card.isDueCompleted,
          name: card.name,
          isOverdue: card.dueDate && !card.isDueCompleted && parseISO(card.dueDate) < new Date(),
        };
      })
      .filter((card) => card.dueDate); // Only show cards with due dates
  });

  const handlePrevious = useCallback(() => {
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, -1) : addWeeks(prev, -1)));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleToggleView = useCallback(() => {
    setViewMode((prev) => (prev === 'month' ? 'week' : 'month'));
  }, []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    let endDate = endOfWeek(monthEnd);

    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      endDate = endOfWeek(weekStart);
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate, viewMode]);

  // Group cards by date
  const cardsByDate = useMemo(() => {
    const grouped = {};
    cardsWithDates.forEach((card) => {
      const date = parseISO(card.dueDate);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(card);
    });
    return grouped;
  }, [cardsWithDates]);

  const renderDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayCards = cardsByDate[dateKey] || [];
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isDayToday = isToday(day);

    return (
      <div
        key={dateKey}
        className={classNames(styles.calendarDay, {
          [styles.otherMonth]: !isCurrentMonth && viewMode === 'month',
          [styles.today]: isDayToday,
        })}
      >
        <div className={styles.dayHeader}>
          <span
            className={classNames(styles.dayNumber, {
              [styles.todayNumber]: isDayToday,
            })}
          >
            {format(day, 'd')}
          </span>
        </div>
        <div className={styles.dayCards}>
          {dayCards.map((card) => (
            <div
              key={card.id}
              className={classNames(styles.calendarCard, {
                [styles.overdue]: card.isOverdue,
                [styles.completed]: card.isDueCompleted,
              })}
            >
              <Card id={card.id} isInline />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <Button.Group>
            <Button icon onClick={handlePrevious} size="small">
              <Icon name="chevron left" />
            </Button>
            <Button onClick={handleToday} size="small">
              {t('action.today', 'Today')}
            </Button>
            <Button icon onClick={handleNext} size="small">
              <Icon name="chevron right" />
            </Button>
          </Button.Group>
        </div>
        <div className={styles.currentPeriod}>
          <h2 className={styles.periodTitle}>
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(
                  endOfWeek(currentDate),
                  'MMM d, yyyy',
                )}`}
          </h2>
        </div>
        <div className={styles.viewToggle}>
          <Button.Group>
            <Button
              active={viewMode === 'month'}
              onClick={handleToggleView}
              size="small"
              disabled={viewMode === 'month'}
            >
              {t('action.month', 'Month')}
            </Button>
            <Button
              active={viewMode === 'week'}
              onClick={handleToggleView}
              size="small"
              disabled={viewMode === 'week'}
            >
              {t('action.week', 'Week')}
            </Button>
          </Button.Group>
        </div>
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekHeader}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>
        <div
          className={classNames(styles.calendarGrid, {
            [styles.weekView]: viewMode === 'week',
          })}
        >
          {calendarDays.map(renderDay)}
        </div>
      </div>
    </div>
  );
});

CalendarView.propTypes = {
  cardIds: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default CalendarView;
