import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import { DateSelectArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useData } from '../context/DataContext';
import { Visita, TipoVisita, EstadoVisita } from '../types';
import { VisitaModal } from '../components/VisitaModal';
import { Filter, Calendar as CalendarIcon, Check, Plus, RefreshCw } from 'lucide-react';

const TODOS_ESTADOS: EstadoVisita[] = ['programada', 'realizada', 'aplazada', 'cancelada'];
const TODOS_TIPOS: TipoVisita[] = ['presentación', 'seguimiento', 'cierre', 'incidencia', 'postventa'];

export const CalendarioPage: React.FC = () => {
  const { comerciales, visitasConDetalle, actualizarVisita, recargarDatos } = useData();
  const calendarRef = useRef<FullCalendar | null>(null);

  // Estados de filtros
  const [selectedComerciales, setSelectedComerciales] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<EstadoVisita[]>(TODOS_ESTADOS);
  const [selectedTipos, setSelectedTipos] = useState<TipoVisita[]>(TODOS_TIPOS);

  // Modal de Visita
  const [modalOpen, setModalOpen] = useState(false);
  const [visitaParaEditar, setVisitaParaEditar] = useState<Visita | null>(null);
  const [slotFechas, setSlotFechas] = useState<{ inicio?: string; fin?: string }>({});

  // Inicializar comerciales seleccionados cuando carguen
  const comercialesIds = useMemo(() => comerciales.map((c) => c.id), [comerciales]);
  const activeComerciales = selectedComerciales.length === 0 ? comercialesIds : selectedComerciales;

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return visitasConDetalle.filter((v) => {
      // Filtro por comercial
      const matchesComercial = activeComerciales.includes(v.comercial_id);
      // Filtro por estado
      const matchesEstado = selectedEstados.includes(v.estado);
      // Filtro por tipo
      const matchesTipo = selectedTipos.includes(v.tipo);

      return matchesComercial && matchesEstado && matchesTipo;
    });
  }, [visitasConDetalle, activeComerciales, selectedEstados, selectedTipos]);

  // Formatear eventos para FullCalendar
  const calendarEvents = useMemo(() => {
    return eventosFiltrados.map((v) => {
      const color = v.comercial?.color || '#3B82F6';
      const clienteNombre = v.cliente?.nombre_empresa || 'Cliente';
      
      // Letra o indicador de estado
      let estadoSuffix = '';
      if (v.estado === 'realizada') estadoSuffix = ' ✓';
      if (v.estado === 'cancelada') estadoSuffix = ' ✕';
      if (v.estado === 'aplazada') estadoSuffix = ' ⏱';

      return {
        id: v.id,
        title: `${clienteNombre} (${v.tipo})${estadoSuffix}`,
        start: v.fecha_inicio,
        end: v.fecha_fin,
        backgroundColor: color,
        borderColor: color,
        textColor: '#FFFFFF',
        extendedProps: {
          visita: v,
        },
      };
    });
  }, [eventosFiltrados]);

  // Manejar selección de hueco vacío
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setVisitaParaEditar(null);
    setSlotFechas({
      inicio: selectInfo.startStr,
      fin: selectInfo.endStr,
    });
    setModalOpen(true);
  };

  // Manejar clic en evento
  const handleEventClick = (clickInfo: { event: { extendedProps: { visita?: Visita } } }) => {
    const visita = clickInfo.event.extendedProps.visita;
    if (visita) {
      setVisitaParaEditar(visita);
      setSlotFechas({});
      setModalOpen(true);
    }
  };

  // Manejar arrastrar y soltar (drag & drop)
  const handleEventDrop = async (info: EventDropArg) => {
    const visita = info.event.extendedProps.visita as Visita | undefined;
    if (!visita || !info.event.start) return;

    const startIso = info.event.start.toISOString();
    let endIso: string;
    if (info.event.end) {
      endIso = info.event.end.toISOString();
    } else {
      // Si el evento no tenía fin, le damos 1 hora por defecto
      endIso = new Date(info.event.start.getTime() + 60 * 60 * 1000).toISOString();
    }

    const exito = await actualizarVisita(visita.id, {
      fecha_inicio: startIso,
      fecha_fin: endIso,
    });

    if (!exito) {
      info.revert();
    }
  };

  // Manejar estirar borde (resize de duración)
  const handleEventResize = async (info: EventResizeDoneArg) => {
    const visita = info.event.extendedProps.visita as Visita | undefined;
    if (!visita || !info.event.start || !info.event.end) return;

    const startIso = info.event.start.toISOString();
    const endIso = info.event.end.toISOString();

    const exito = await actualizarVisita(visita.id, {
      fecha_inicio: startIso,
      fecha_fin: endIso,
    });

    if (!exito) {
      info.revert();
    }
  };

  // Toggle comercial filter
  const toggleComercial = (id: string) => {
    if (selectedComerciales.includes(id)) {
      if (selectedComerciales.length === 1) {
        // Si es el único seleccionado, volver a seleccionar todos
        setSelectedComerciales([]);
      } else {
        setSelectedComerciales(selectedComerciales.filter((c) => c !== id));
      }
    } else {
      if (selectedComerciales.length === 0) {
        // Estaban todos seleccionados, ahora solo este
        setSelectedComerciales([id]);
      } else {
        setSelectedComerciales([...selectedComerciales, id]);
      }
    }
  };

  const seleccionarTodosComerciales = () => {
    setSelectedComerciales([]);
  };

  // Toggle estado filter
  const toggleEstado = (estado: EstadoVisita) => {
    if (selectedEstados.includes(estado)) {
      if (selectedEstados.length > 1) {
        setSelectedEstados(selectedEstados.filter((e) => e !== estado));
      }
    } else {
      setSelectedEstados([...selectedEstados, estado]);
    }
  };

  // Toggle tipo filter
  const toggleTipo = (tipo: TipoVisita) => {
    if (selectedTipos.includes(tipo)) {
      if (selectedTipos.length > 1) {
        setSelectedTipos(selectedTipos.filter((t) => t !== tipo));
      }
    } else {
      setSelectedTipos([...selectedTipos, tipo]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Calendario de Visitas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Planificación semanal y mensual. Arrastra una visita para cambiar su fecha u hora.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => recargarDatos()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Recargar visitas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setVisitaParaEditar(null);
              setSlotFechas({});
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Visita
          </button>
        </div>
      </div>

      {/* Panel de Filtros Interactivos */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          <span>Filtros Rápidos</span>
          <span className="text-[11px] font-normal text-slate-400 ml-auto">
            Mostrando {eventosFiltrados.length} de {visitasConDetalle.length} visitas
          </span>
        </div>

        {/* Comerciales Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mr-1">Comercial:</span>
          <button
            onClick={seleccionarTodosComerciales}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedComerciales.length === 0
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({comerciales.length})
          </button>

          {comerciales.map((c) => {
            const isSelected = selectedComerciales.length === 0 || selectedComerciales.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleComercial(c.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  isSelected
                    ? 'text-white shadow-xs border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isSelected ? c.color : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white/80" />
                <span>{c.nombre} {c.apellidos.split(' ')[0]}</span>
                {isSelected && selectedComerciales.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Estado Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mr-1">Estado:</span>
          {TODOS_ESTADOS.map((est) => {
            const isSelected = selectedEstados.includes(est);
            return (
              <button
                key={est}
                onClick={() => toggleEstado(est)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-all border ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {est}
              </button>
            );
          })}

          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

          {/* Tipo Chips */}
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mr-1">Tipo:</span>
          {TODOS_TIPOS.map((tp) => {
            const isSelected = selectedTipos.includes(tp);
            return (
              <button
                key={tp}
                onClick={() => toggleTipo(tp)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-xs'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendario FullCalendar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista',
          }}
          locale="es"
          firstDay={1} // Semana empieza en lunes
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          nowIndicator={true}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
          expandRows={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </div>

      {/* Modal de Visita */}
      <VisitaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        visitaParaEditar={visitaParaEditar}
        fechaInicioDefault={slotFechas.inicio}
        fechaFinDefault={slotFechas.fin}
      />
    </div>
  );
};
